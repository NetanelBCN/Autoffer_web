package org.socialnetwork.messagingserver.models

data class UserChatsRequest(
    val userId: String,
    val page: Int,
    val size: Int
)
