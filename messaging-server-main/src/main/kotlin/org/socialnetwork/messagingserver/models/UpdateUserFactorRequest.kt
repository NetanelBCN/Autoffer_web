package org.socialnetwork.messagingserver.models

data class UpdateUserFactorRequest(
    val userId: String,
    val factor: Double
)