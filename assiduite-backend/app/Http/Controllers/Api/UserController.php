<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('role')->get();

        return response()->json($users);
    }

    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::findOrFail($validated['role_id']);

        $user->update([
            'role_id' => $role->id,
        ]);

        return response()->json([
            'message' => 'Role updated successfully',
            'user' => $user->fresh('role'),
        ]);
    }
}
