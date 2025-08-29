package org.socialnetwork.messagingserver.models

data class CreateQuoteFromBOQRequest(
    val projectId: String,
    val factoryId: String
)