package org.socialnetwork.messagingserver.models

data class UpdateProjectItemsRequest(
    val projectId: String,
    val items: List<ItemModel>
)
