<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportStagiairesRequest;
use App\Http\Requests\StoreManualStagiaireRequest;
use App\Models\Groupe;
use App\Models\Role;
use App\Models\Stagiaire;
use App\Models\User;
use App\Services\StagiaireSpreadsheetImportService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Throwable;

class StagiaireController extends Controller
{
    public function index()
    {
        $stagiaires = Stagiaire::with(['user', 'groupe'])->get();

        return response()->json($stagiaires);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:stagiaires,user_id',
            'groupe_id' => 'required|exists:groupes,id',
            'numero_stagiaire' => 'nullable|string|unique:stagiaires,numero_stagiaire',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'cin' => 'nullable|string|unique:stagiaires,cin',
            'date_naissance' => 'nullable|date',
            'genre' => 'nullable|string|max:255',
            'niveau_scolaire' => 'nullable|string|max:255',
            'annee_bac' => 'nullable|string|max:255',
            'moyenne_bac' => 'nullable|numeric|min:0|max:20',
            'telephone' => 'nullable|string',
            'photo' => 'nullable|string',
            'matricule' => 'nullable|string|unique:stagiaires,matricule',
            'note_assiduite' => 'nullable|numeric'
        ]);

        $stagiaire = Stagiaire::create($validated);

        return response()->json($stagiaire, 201);
    }

    public function storeManual(StoreManualStagiaireRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $stagiaireRole = $this->resolveStagiaireRole();

        if (!$stagiaireRole) {
            return response()->json([
                'message' => 'Le role stagiaire est introuvable.'
            ], 500);
        }

        $stagiaire = DB::transaction(fn () => $this->createLinkedStagiaire($validated, $stagiaireRole));

        $stagiaire->load(['user.role', 'groupe']);

        return response()->json([
            'message' => 'Stagiaire cree avec succes.',
            'stagiaire' => $stagiaire,
            'credentials' => [
                'email' => $stagiaire->user?->email,
                'temporary_password' => 'Password!123',
                'must_change_password' => true,
            ],
        ], 201);
    }

    public function import(
        ImportStagiairesRequest $request,
        StagiaireSpreadsheetImportService $spreadsheetImportService
    ): JsonResponse {
        $file = $request->file('file');
        $stagiaireRole = $this->resolveStagiaireRole();

        if (!$stagiaireRole) {
            Log::error('Stagiaire import aborted: role not found.');

            return response()->json([
                'message' => 'Le role stagiaire est introuvable.',
            ], 500);
        }

        Log::info('Stagiaire import started.', [
            'original_name' => $file?->getClientOriginalName(),
            'extension' => $file?->getClientOriginalExtension(),
            'size' => $file?->getSize(),
        ]);

        try {
            $parsed = $spreadsheetImportService->parse($file);
            $normalizedHeaders = $this->normalizeHeaders($parsed['headers'] ?? []);
            $missingColumns = $this->findMissingRequiredImportColumns($normalizedHeaders);
        } catch (Throwable $exception) {
            Log::error('Stagiaire import fatal setup failure.', [
                'message' => $exception->getMessage(),
                'exception_class' => $exception::class,
                'original_name' => $file?->getClientOriginalName(),
            ]);

            return response()->json([
                'message' => 'Impossible de preparer l import. ' . $this->formatImportExceptionMessage($exception),
            ], 500);
        }

        Log::info('Stagiaire import parsed file.', [
            'headers' => array_values($parsed['headers'] ?? []),
            'normalized_headers' => array_keys($normalizedHeaders),
            'row_count' => count($parsed['rows'] ?? []),
        ]);

        if ($missingColumns !== []) {
            Log::warning('Stagiaire import rejected: missing required columns.', [
                'missing_columns' => $missingColumns,
            ]);

            return response()->json([
                'message' => 'Le fichier Excel ne contient pas toutes les colonnes requises.',
                'missing_columns' => $missingColumns,
            ], 422);
        }

        $summary = [
            'total_rows' => count($parsed['rows'] ?? []),
            'created_count' => 0,
            'skipped_count' => 0,
            'failed_count' => 0,
            'created_rows' => [],
            'skipped_rows' => [],
            'failed_rows' => [],
        ];

        foreach ($parsed['rows'] ?? [] as $index => $row) {
            $rowNumber = $index + 2;

            try {
                $mappedRow = $this->mapImportRow($row, $normalizedHeaders);
                $rowContext = $this->buildImportRowContext($rowNumber, $row, $mappedRow);
                Log::info('Stagiaire import row mapped.', $rowContext);
                $validation = $this->validateImportRow($mappedRow);

                if ($validation->fails()) {
                    Log::warning('Stagiaire import row skipped after validation.', array_merge($rowContext, [
                        'validation_errors' => $validation->errors()->all(),
                    ]));

                    $summary['skipped_count']++;
                    $summary['skipped_rows'][] = [
                        'row' => $rowNumber,
                        'cin' => $mappedRow['cin'] ?? null,
                        'numero_stagiaire' => $mappedRow['numero_stagiaire'] ?? null,
                        'reasons' => $validation->errors()->all(),
                    ];
                    continue;
                }

                Log::info('Stagiaire import row persistence starting.', $rowContext);
                $stagiaire = DB::transaction(fn () => $this->createLinkedStagiaire($validation->validated(), $stagiaireRole));
                $stagiaire->load(['user.role', 'groupe']);

                Log::info('Stagiaire import row created.', array_merge($rowContext, [
                    'stagiaire_id' => $stagiaire->id,
                    'user_id' => $stagiaire->user_id,
                ]));

                $summary['created_count']++;
                $summary['created_rows'][] = [
                    'row' => $rowNumber,
                    'id' => $stagiaire->id,
                    'nom' => $stagiaire->nom,
                    'prenom' => $stagiaire->prenom,
                    'cin' => $stagiaire->cin,
                    'email' => $stagiaire->user?->email,
                    'matricule' => $stagiaire->matricule,
                    'numero_stagiaire' => $stagiaire->numero_stagiaire,
                    'groupe' => $stagiaire->groupe?->nom,
                ];
            } catch (Throwable $exception) {
                $mappedRow = $mappedRow ?? [];
                $rowContext = $this->buildImportRowContext($rowNumber, $row, $mappedRow);
                $reason = $this->formatImportExceptionMessage($exception);

                Log::error('Stagiaire import row failed.', array_merge($rowContext, [
                    'message' => $exception->getMessage(),
                    'formatted_message' => $reason,
                    'exception_class' => $exception::class,
                ]));

                if ($this->isDuplicateImportException($exception)) {
                    $summary['skipped_count']++;
                    $summary['skipped_rows'][] = [
                        'row' => $rowNumber,
                        'cin' => $mappedRow['cin'] ?? $row['CIN'] ?? $row['cin'] ?? null,
                        'numero_stagiaire' => $row['Numéro stagiaire'] ?? $row['Numero stagiaire'] ?? null,
                        'reasons' => [$reason],
                    ];
                    continue;
                }

                $summary['failed_count']++;
                $summary['failed_rows'][] = [
                    'row' => $rowNumber,
                        'cin' => $mappedRow['cin'] ?? $row['CIN'] ?? $row['cin'] ?? null,
                    'numero_stagiaire' => $row['Numéro stagiaire'] ?? $row['Numero stagiaire'] ?? null,
                    'reasons' => [$reason],
                ];
            }
        }

        Log::info('Stagiaire import finished.', [
            'summary' => [
                'total_rows' => $summary['total_rows'],
                'created_count' => $summary['created_count'],
                'skipped_count' => $summary['skipped_count'],
                'failed_count' => $summary['failed_count'],
            ],
        ]);

        return response()->json([
            'message' => 'Import des stagiaires termine.',
            'summary' => $summary,
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $stagiaire = Stagiaire::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:stagiaires,user_id,' . $stagiaire->id,
            'groupe_id' => 'required|exists:groupes,id',
            'numero_stagiaire' => 'nullable|string|unique:stagiaires,numero_stagiaire,' . $stagiaire->id,
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'cin' => 'nullable|string|unique:stagiaires,cin,' . $stagiaire->id,
            'date_naissance' => 'nullable|date',
            'genre' => 'nullable|string|max:255',
            'niveau_scolaire' => 'nullable|string|max:255',
            'annee_bac' => 'nullable|string|max:255',
            'moyenne_bac' => 'nullable|numeric|min:0|max:20',
            'telephone' => 'nullable|string',
            'photo' => 'nullable|string',
            'matricule' => 'nullable|string|unique:stagiaires,matricule,' . $stagiaire->id,
            'note_assiduite' => 'nullable|numeric'
        ]);

        $stagiaire->update($validated);

        return response()->json($stagiaire);
    }

    public function destroy($id)
    {
        $stagiaire = Stagiaire::findOrFail($id);
        $stagiaire->delete();

        return response()->json([
            'message' => 'Stagiaire deleted successfully'
        ]);
    }

    private function generateUniqueMatricule(): string
    {
        $year = now()->format('Y');
        $sequence = 1;

        do {
            $candidate = sprintf('STG-%s-%04d', $year, $sequence);
            $exists = Stagiaire::query()->where('matricule', $candidate)->exists();
            $sequence++;
        } while ($exists);

        return $candidate;
    }

    private function generateUniqueEmailFromMatricule(string $matricule): string
    {
        $base = strtolower($matricule) . '@ofppt.local';
        $candidate = $base;
        $suffix = 1;

        while (User::query()->where('email', $candidate)->exists()) {
            $candidate = strtolower($matricule) . '-' . $suffix . '@ofppt.local';
            $suffix++;
        }

        return $candidate;
    }

    private function resolveNumeroStagiaire(?string $providedValue): string
    {
        if ($providedValue) {
            return $providedValue;
        }

        $year = now()->format('Y');
        $sequence = 1;

        do {
            $candidate = sprintf('NUM-%s-%04d', $year, $sequence);
            $exists = Stagiaire::query()->where('numero_stagiaire', $candidate)->exists();
            $sequence++;
        } while ($exists);

        return $candidate;
    }

    private function createLinkedStagiaire(array $validated, Role $stagiaireRole): Stagiaire
    {
        $matricule = $this->generateUniqueMatricule();
        $email = $this->generateUniqueEmailFromMatricule($matricule);
        $numeroStagiaire = $this->resolveNumeroStagiaire($validated['numero_stagiaire'] ?? null);

        $userPayload = $this->filterExistingTableColumns('users', [
            'name' => trim($validated['prenom'] . ' ' . $validated['nom']),
            'email' => $email,
            'password' => Hash::make('Password!123'),
            'role_id' => $stagiaireRole->id,
            'must_change_password' => true,
            'status' => 'active',
        ]);

        $user = User::create($userPayload);

        $stagiairePayload = $this->filterExistingTableColumns('stagiaires', [
            'user_id' => $user->id,
            'groupe_id' => $validated['groupe_id'],
            'numero_stagiaire' => $numeroStagiaire,
            'matricule' => $matricule,
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'cin' => $validated['cin'],
            'date_naissance' => $validated['date_naissance'],
            'genre' => $validated['genre'],
            'telephone' => $validated['telephone'] ?? null,
            'photo' => $validated['photo'] ?? null,
            'niveau_scolaire' => $validated['niveau_scolaire'],
            'annee_bac' => $validated['annee_bac'] ?? null,
            'moyenne_bac' => $validated['moyenne_bac'] ?? null,
            'niveau' => $validated['niveau'],
            'code_filiere' => $validated['code_filiere'],
            'filiere' => $validated['filiere'],
            'type_formation' => $validated['type_formation'] ?? null,
            'annee_etude' => $validated['annee_etude'],
            'nationalite' => $validated['nationalite'] ?? 'Marocaine',
            'date_inscription' => $validated['date_inscription'] ?? now()->toDateString(),
            'date_dossier_complet' => $validated['date_dossier_complet'] ?? null,
            'motif_admission' => $validated['motif_admission'] ?? null,
            'statut' => $validated['statut'] ?? 'actif',
            'note_assiduite' => $validated['note_assiduite'] ?? 0,
        ]);

        try {
            return Stagiaire::create($stagiairePayload);
        } catch (Throwable $exception) {
            Log::error('Stagiaire import persistence failed inside transaction.', [
                'user_payload' => array_diff_key($userPayload, ['password' => true]),
                'stagiaire_payload' => $stagiairePayload,
                'message' => $exception->getMessage(),
                'exception_class' => $exception::class,
            ]);

            throw $exception;
        }
    }

    private function resolveStagiaireRole(): ?Role
    {
        return Role::query()
            ->where('nom', Role::ROLE_STAGIAIRE)
            ->first();
    }

    private function normalizeHeaders(array $headers): array
    {
        $normalized = [];

        foreach ($headers as $header) {
            $normalized[$this->normalizeImportHeader($header)] = trim((string) $header);
        }

        return $normalized;
    }

    private function normalizeImportHeader(?string $header): string
    {
        $value = trim((string) $header);

        if ($value === '') {
            return '';
        }

        $value = $this->normalizeImportText($value);
        $value = mb_strtolower($value, 'UTF-8');
        $value = preg_replace('/[^a-z0-9]+/u', '_', $value) ?? '';

        return trim($value, '_');
    }

    private function normalizeImportText(string $value): string
    {
        $normalized = trim($value);

        if ($normalized === '') {
            return '';
        }

        if (class_exists(\Normalizer::class)) {
            $decomposed = \Normalizer::normalize($normalized, \Normalizer::FORM_D);

            if (is_string($decomposed) && $decomposed !== '') {
                $normalized = preg_replace('/\p{Mn}+/u', '', $decomposed) ?? $decomposed;
            }
        }

        $normalized = str_replace(
            ['À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'à', 'á', 'â', 'ã', 'ä', 'å',
             'Ç', 'ç',
             'È', 'É', 'Ê', 'Ë', 'è', 'é', 'ê', 'ë',
             'Ì', 'Í', 'Î', 'Ï', 'ì', 'í', 'î', 'ï',
             'Ñ', 'ñ',
             'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø',
             'Ù', 'Ú', 'Û', 'Ü', 'ù', 'ú', 'û', 'ü',
             'Ý', 'Ÿ', 'ý', 'ÿ',
             'Æ', 'æ', 'Œ', 'œ'],
            ['A', 'A', 'A', 'A', 'A', 'A', 'a', 'a', 'a', 'a', 'a', 'a',
             'C', 'c',
             'E', 'E', 'E', 'E', 'e', 'e', 'e', 'e',
             'I', 'I', 'I', 'I', 'i', 'i', 'i', 'i',
             'N', 'n',
             'O', 'O', 'O', 'O', 'O', 'O', 'o', 'o', 'o', 'o', 'o', 'o',
             'U', 'U', 'U', 'U', 'u', 'u', 'u', 'u',
             'Y', 'Y', 'y', 'y',
             'AE', 'ae', 'OE', 'oe'],
            $normalized
        );

        $transliterated = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized);

        if ($transliterated !== false && $transliterated !== '') {
            $normalized = $transliterated;
        }

        return $normalized;
    }

    private function findMissingRequiredImportColumns(array $normalizedHeaders): array
    {
        $required = [
            'niveau' => 'Niveau',
            'code_filiere' => 'Code Filière',
            'filiere' => 'Filière',
            'groupe' => 'Groupe',
            'annee_etude' => 'Année étude',
            'cin' => 'CIN',
            'nom' => 'Nom',
            'prenom' => 'Prénom',
            'genre' => 'Genre',
            'date_naissance' => 'Date naissance',
            'niveau_scolaire' => 'Niveau scolaire',
        ];

        $missing = [];

        foreach ($required as $column => $label) {
            if (!array_key_exists($column, $normalizedHeaders)) {
                $missing[] = $label;
            }
        }

        return $missing;
    }

    private function mapImportRow(array $row, array $normalizedHeaders): array
    {
        $normalizedRow = [];

        foreach ($row as $header => $value) {
            $normalizedRow[$this->normalizeImportHeader($header)] = is_string($value) ? trim($value) : $value;
        }

        $groupName = $normalizedRow['groupe'] ?? null;
        $group = $this->resolveGroupByName($groupName);

        return [
            'groupe_id' => $group?->id,
            'numero_stagiaire' => $this->nullableString($normalizedRow['numero_stagiaire'] ?? null),
            'nom' => $this->nullableString($normalizedRow['nom'] ?? null),
            'prenom' => $this->nullableString($normalizedRow['prenom'] ?? null),
            'cin' => $this->nullableString($normalizedRow['cin'] ?? null),
            'date_naissance' => $this->normalizeDateValue($normalizedRow['date_naissance'] ?? null),
            'genre' => $this->nullableString($normalizedRow['genre'] ?? null),
            'telephone' => null,
            'photo' => null,
            'niveau_scolaire' => $this->nullableString($normalizedRow['niveau_scolaire'] ?? null),
            'annee_bac' => $this->nullableString($normalizedRow['annee_bac'] ?? null),
            'moyenne_bac' => $this->normalizeDecimalValue($normalizedRow['moyenne_bac'] ?? null),
            'niveau' => $this->nullableString($normalizedRow['niveau'] ?? null),
            'code_filiere' => $this->nullableString($normalizedRow['code_filiere'] ?? null),
            'filiere' => $this->nullableString($normalizedRow['filiere'] ?? null),
            'type_formation' => $this->nullableString($normalizedRow['type_formation'] ?? null),
            'annee_etude' => $this->nullableString($normalizedRow['annee_etude'] ?? null),
            'nationalite' => $this->nullableString($normalizedRow['nationalite'] ?? null) ?? 'Marocaine',
            'date_inscription' => $this->normalizeDateValue($normalizedRow['date_inscription'] ?? null) ?? now()->toDateString(),
            'date_dossier_complet' => $this->normalizeDateValue($normalizedRow['date_dossier_complet'] ?? null),
            'motif_admission' => $this->nullableString(
                $normalizedRow['motif_dadmission']
                ?? $normalizedRow['motif_d_admission']
                ?? null
            ),
            'note_assiduite' => 0,
            'statut' => 'actif',
            '_groupe_label' => $groupName,
        ];
    }

    private function validateImportRow(array $mappedRow)
    {
        $validator = Validator::make($mappedRow, [
            'groupe_id' => ['required', 'exists:groupes,id'],
            'numero_stagiaire' => ['nullable', 'string', 'max:255', Rule::unique('stagiaires', 'numero_stagiaire')],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'cin' => ['required', 'string', 'max:255', Rule::unique('stagiaires', 'cin')],
            'date_naissance' => ['required', 'date'],
            'genre' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string', 'max:255'],
            'niveau_scolaire' => ['required', 'string', 'max:255'],
            'annee_bac' => ['nullable', 'string', 'max:255'],
            'moyenne_bac' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'niveau' => ['required', 'string', 'max:255'],
            'code_filiere' => ['required', 'string', 'max:255'],
            'filiere' => ['required', 'string', 'max:255'],
            'type_formation' => ['nullable', 'string', 'max:255'],
            'annee_etude' => ['required', 'string', 'max:255'],
            'nationalite' => ['nullable', 'string', 'max:255'],
            'date_inscription' => ['nullable', 'date'],
            'date_dossier_complet' => ['nullable', 'date'],
            'motif_admission' => ['nullable', 'string', 'max:255'],
            'note_assiduite' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'statut' => ['nullable', 'string', 'max:255'],
        ], [
            'groupe_id.required' => 'Le groupe est introuvable pour cette ligne.',
            'groupe_id.exists' => 'Le groupe reference dans le fichier n existe pas.',
            'cin.unique' => 'Le CIN existe deja.',
            'numero_stagiaire.unique' => 'Le numero stagiaire existe deja.',
        ]);

        return $validator;
    }

    private function resolveGroupByName(?string $groupName): ?Groupe
    {
        $normalizedName = $this->nullableString($groupName);

        if ($normalizedName === null) {
            return null;
        }

        return Groupe::query()
            ->where('nom', $normalizedName)
            ->orWhereRaw('LOWER(TRIM(nom)) = ?', [mb_strtolower(trim($normalizedName), 'UTF-8')])
            ->first();
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }

    private function normalizeDecimalValue(mixed $value): ?float
    {
        $string = $this->nullableString($value);

        if ($string === null) {
            return null;
        }

        $normalized = str_replace(',', '.', $string);

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function normalizeDateValue(mixed $value): ?string
    {
        $string = $this->nullableString($value);

        if ($string === null) {
            return null;
        }

        if (is_numeric($string)) {
            $serial = (float) $string;

            if ($serial > 0) {
                return Carbon::create(1899, 12, 30)->addDays((int) floor($serial))->toDateString();
            }
        }

        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y'];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $string)->toDateString();
            } catch (Throwable) {
            }
        }

        try {
            return Carbon::parse($string)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    private function isDuplicateImportException(Throwable $exception): bool
    {
        $message = mb_strtolower($exception->getMessage(), 'UTF-8');

        if ($exception instanceof QueryException && (string) $exception->getCode() === '23000') {
            return true;
        }

        return str_contains($message, 'duplicate')
            || str_contains($message, 'unique')
            || str_contains($message, 'existe deja');
    }

    private function buildImportRowContext(int $rowNumber, array $row, array $mappedRow = []): array
    {
        return [
            'row' => $rowNumber,
            'cin' => $mappedRow['cin'] ?? $row['CIN'] ?? $row['cin'] ?? null,
            'numero_stagiaire' => $mappedRow['numero_stagiaire'] ?? $row['Numero stagiaire'] ?? null,
            'groupe_label' => $mappedRow['_groupe_label'] ?? $row['Groupe'] ?? $row['groupe'] ?? null,
            'groupe_id' => $mappedRow['groupe_id'] ?? null,
        ];
    }

    private function formatImportExceptionMessage(Throwable $exception): string
    {
        $message = trim($exception->getMessage());

        if ($message === '') {
            return 'Erreur technique lors de l import.';
        }

        if ($exception instanceof QueryException && str_contains($message, "Unknown column 'status'")) {
            return 'La colonne users.status est absente de la base de donnees.';
        }

        return $message;
    }

    private function filterExistingTableColumns(string $table, array $payload): array
    {
        $columns = array_flip(Schema::getColumnListing($table));

        return array_filter(
            $payload,
            static fn ($key) => isset($columns[$key]),
            ARRAY_FILTER_USE_KEY
        );
    }
}
