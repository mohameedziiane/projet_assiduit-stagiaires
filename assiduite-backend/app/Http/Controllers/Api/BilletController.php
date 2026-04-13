<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Billet;
use App\Models\Seance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BilletController extends Controller
{
    public function index()
    {
        return Billet::with(['stagiaire', 'absence', 'personnel'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'stagiaire_id' => 'required|exists:stagiaires,id',
            'absence_id' => 'nullable|exists:absences,id',
            'personnel_id' => 'required|exists:personnels,id',
            'type' => ['required', Rule::in(['absence', 'retard', 'entree'])],
            'qr_code' => 'nullable|string|max:255',
            'motif' => 'nullable|string',
            'date_validite' => 'required|date',
            'duree_retard_minutes' => 'nullable|integer|min:0'
        ]);

        $absence = $this->resolveLinkedAbsence(
            $validated['absence_id'] ?? null,
            (int) $validated['stagiaire_id']
        );

        $billet = Billet::create([
            'stagiaire_id' => $validated['stagiaire_id'],
            'absence_id' => $absence?->id,
            'personnel_id' => $validated['personnel_id'],
            'type' => $validated['type'],
            'code_unique' => strtoupper(Str::random(8)),
            'qr_code' => $validated['qr_code'] ?? null,
            'motif' => $validated['motif'] ?? null,
            'date_validite' => $validated['date_validite'],
            'duree_retard_minutes' => $validated['duree_retard_minutes'] ?? null,
            'est_actif' => true
        ]);

        return response()->json($billet, 201);
    }

    public function show($id)
    {
        return Billet::with(['stagiaire', 'absence', 'personnel'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $billet = Billet::findOrFail($id);

        $validated = $request->validate([
            'stagiaire_id' => 'required|exists:stagiaires,id',
            'absence_id' => 'nullable|exists:absences,id',
            'personnel_id' => 'required|exists:personnels,id',
            'type' => ['required', Rule::in(['absence', 'retard', 'entree'])],
            'qr_code' => 'nullable|string|max:255',
            'motif' => 'nullable|string',
            'date_validite' => 'required|date',
            'duree_retard_minutes' => 'nullable|integer|min:0',
            'est_actif' => 'sometimes|boolean',
        ]);

        $absence = $this->resolveLinkedAbsence(
            $validated['absence_id'] ?? null,
            (int) $validated['stagiaire_id']
        );

        $billet->update([
            'stagiaire_id' => $validated['stagiaire_id'],
            'absence_id' => $absence?->id,
            'personnel_id' => $validated['personnel_id'],
            'type' => $validated['type'],
            'qr_code' => $validated['qr_code'] ?? $billet->qr_code,
            'motif' => $validated['motif'] ?? null,
            'date_validite' => $validated['date_validite'],
            'duree_retard_minutes' => $validated['duree_retard_minutes'] ?? null,
            'est_actif' => $validated['est_actif'] ?? $billet->est_actif,
        ]);

        return response()->json($billet);
    }

    public function destroy($id)
    {
        $billet = Billet::findOrFail($id);
        $billet->delete();

        return response()->json(['message' => 'Billet deleted']);
    }

    public function verifierAutorisation(Request $request, $id = null)
    {
        if ($id !== null) {
            $billet = Billet::with(['stagiaire', 'absence.seance', 'personnel'])->findOrFail($id);

            return response()->json($this->buildAuthorizationResponse($billet, 'billet_id'));
        }

        $validated = $request->validate([
            'code_unique' => 'nullable|string',
            'stagiaire_id' => 'required_without:code_unique|exists:stagiaires,id',
            'seance_id' => 'required_without:code_unique|exists:seances,id',
        ]);

        $billetQuery = Billet::with(['stagiaire', 'absence.seance', 'personnel'])
            ->where('est_actif', true);

        if (!empty($validated['code_unique'])) {
            $billet = $billetQuery
                ->where('code_unique', strtoupper($validated['code_unique']))
                ->latest('date_validite')
                ->first();

            if (!$billet) {
                return response()->json([
                    'autorise' => false,
                    'message' => 'Aucun billet correspondant.'
                ], 404);
            }

            return response()->json($this->buildAuthorizationResponse($billet, 'code_unique'));
        }

        $seanceId = (int) $validated['seance_id'];
        $seanceDate = Seance::query()
            ->whereKey($seanceId)
            ->value('date_seance');

        $billet = $billetQuery
            ->where('stagiaire_id', $validated['stagiaire_id'])
            ->where(function ($query) use ($seanceId, $seanceDate) {
                $query->whereHas('absence', function ($absenceQuery) use ($seanceId) {
                    $absenceQuery->where('seance_id', $seanceId);
                });

                if ($seanceDate) {
                    $query->orWhereDate('date_validite', $seanceDate);
                }
            })
            ->latest('date_validite')
            ->first();

        if (!$billet) {
            return response()->json([
                'autorise' => false,
                'message' => 'Aucun billet actif pour ce stagiaire et cette seance.'
            ], 404);
        }

        $response = $this->buildAuthorizationResponse($billet, 'stagiaire_et_seance');
        $response['seance_id'] = $seanceId;

        return response()->json($response);
    }

    private function resolveLinkedAbsence(?int $absenceId, int $stagiaireId): ?Absence
    {
        if ($absenceId === null) {
            return null;
        }

        $absence = Absence::findOrFail($absenceId);

        if ($absence->stagiaire_id !== $stagiaireId) {
            abort(422, 'L\'absence selectionnee n\'appartient pas a ce stagiaire.');
        }

        return $absence;
    }

    private function buildAuthorizationResponse(Billet $billet, string $matchedBy): array
    {
        $now = Carbon::now();
        $dateValidite = Carbon::parse($billet->date_validite)->endOfDay();
        $autorise = $billet->est_actif && $dateValidite->greaterThanOrEqualTo($now);

        return [
            'billet_id' => $billet->id,
            'matched_by' => $matchedBy,
            'code_unique' => $billet->code_unique,
            'stagiaire_id' => $billet->stagiaire_id,
            'absence_id' => $billet->absence_id,
            'type' => $billet->type,
            'date_validite' => $billet->date_validite,
            'est_actif' => $billet->est_actif,
            'autorise' => $autorise,
            'message' => $autorise ? 'Billet autorise' : 'Billet non autorise'
        ];
    }
}
