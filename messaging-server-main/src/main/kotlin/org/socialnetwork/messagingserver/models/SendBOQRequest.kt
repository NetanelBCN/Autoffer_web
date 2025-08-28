package org.socialnetwork.messagingserver.models

data class SendBOQRequest(
    val projectId: String,
    val factoryIds: List<String>
)
