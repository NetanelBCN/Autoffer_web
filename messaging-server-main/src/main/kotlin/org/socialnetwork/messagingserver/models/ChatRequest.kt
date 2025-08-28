package org.socialnetwork.messagingserver.models

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

data class ChatRequest @JsonCreator constructor(
    @JsonProperty("currentUserId")
    val currentUserId: String,
    @JsonProperty("otherUserId")
    val otherUserId: String
)
