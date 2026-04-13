<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualStagiaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'groupe_id' => ['required', 'exists:groupes,id'],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'cin' => ['required', 'string', 'max:255', 'unique:stagiaires,cin'],
            'date_naissance' => ['required', 'date'],
            'genre' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string', 'max:2048'],
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
            'numero_stagiaire' => ['nullable', 'string', 'max:255', 'unique:stagiaires,numero_stagiaire'],
            'statut' => ['nullable', 'string', 'max:255'],
            'note_assiduite' => ['nullable', 'numeric', 'min:0', 'max:20'],
        ];
    }
}
