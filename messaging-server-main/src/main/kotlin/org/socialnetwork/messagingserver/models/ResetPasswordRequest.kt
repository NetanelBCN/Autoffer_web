package org.socialnetwork.messagingserver.models

data class ResetPasswordRequest(
    val phoneNumber: String,
    val newPassword: String
)
