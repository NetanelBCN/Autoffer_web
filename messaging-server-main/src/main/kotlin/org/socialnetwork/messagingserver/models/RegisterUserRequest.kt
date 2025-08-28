package org.socialnetwork.messagingserver.models

data class RegisterUserRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val phoneNumber: String,
    val address: String,
    val profileType: UserType
)
