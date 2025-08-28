package org.socialnetwork.messagingserver.models

data class UpdateFactoryStatusRequest(
    val projectId: String,
    val factoryId: String,
    val newStatus: QuoteStatus
)
