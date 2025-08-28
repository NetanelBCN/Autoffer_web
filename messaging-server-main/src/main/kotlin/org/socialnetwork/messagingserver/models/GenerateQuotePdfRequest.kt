package org.socialnetwork.messagingserver.models

import FactoryUserModel


data class GenerateQuotePdfRequest(
    val projectId: String,
    val client: UserModel,
    val factoryUser: FactoryUserModel,
    val factoryLogoBytes: ByteArray
)
