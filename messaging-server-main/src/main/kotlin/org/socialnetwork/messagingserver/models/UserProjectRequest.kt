package org.socialnetwork.messagingserver.models

data class UserProjectRequest(
    val userId: String,
    val profileType: UserType
)
