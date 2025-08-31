package org.socialnetwork.messagingserver.models

data class UpdateUserNameRequest(
    val userId: String,
    val firstName: String,
    val lastName: String
)