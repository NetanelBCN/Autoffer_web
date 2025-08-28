package org.socialnetwork.messagingserver.models

import com.fasterxml.jackson.annotation.JsonFormat
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.TypeAlias
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.LocalDateTime

@Document("users")
@TypeAlias("user")
open class UserModel(
    @Id
    open val id: String? = null,
    open val firstName: String,
    open val lastName: String,
    open val email: String,
    open val password: String,
    open val phoneNumber: String,
    open val address: String,
    @Field("profileType")
    open val profileType: UserType,
    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    open val registeredAt: LocalDateTime = LocalDateTime.now(),
    open val chats: MutableList<String> = mutableListOf(),
    open val photoBytes: ByteArray? = null

)
