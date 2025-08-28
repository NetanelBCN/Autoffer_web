package org.socialnetwork.messagingserver.models

data class FactoryStatusDto(
    val factoryId: String,
    val quoteStatus: QuoteStatus,
    val sentAt: String?
)
