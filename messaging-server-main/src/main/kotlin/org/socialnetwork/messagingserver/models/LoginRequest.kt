package org.socialnetwork.messagingserver.models

data class LoginRequest(
    val email: String,
    val password: String
)
