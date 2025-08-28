package org.socialnetwork.messagingserver.models

data class CreateProjectRequest(
    val clientId: String,
    val projectAddress: String,
    val items: List<ItemModelDTO>,
    val factoryIds: List<String>
)
