package org.socialnetwork.messagingserver.models

data class UpdateUserPasswordRequest(
    val userId: String,
    val currentPassword: String,
    val newPassword: String
)