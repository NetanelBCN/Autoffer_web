package org.socialnetwork.messagingserver.services



import FactoryUserModel
import org.socialnetwork.messagingserver.models.*

import org.socialnetwork.messagingserver.repositories.UserRepository
import org.springframework.data.mongodb.core.ReactiveMongoTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Service
class UserService(private val userRepository: UserRepository,
                  private val mongoTemplate: ReactiveMongoTemplate
) {

    // ✅ רישום משתמש חדש עם כל השדות
    fun registerUser(request: RegisterUserRequest): Mono<UserModel> {
        return userRepository.findByEmail(request.email)
            .flatMap {
                Mono.error<UserModel>(IllegalStateException("User with this email already exists"))
            }
            .switchIfEmpty(
                userRepository.save(
                    UserModel(
                        id = null,
                        firstName = request.firstName,
                        lastName = request.lastName,
                        email = request.email,
                        password = request.password,
                        phoneNumber = request.phoneNumber,
                        address = request.address,
                        profileType = request.profileType,
                        registeredAt = LocalDateTime.now(),
                        chats = mutableListOf()
                    )
                )
            )
    }
    // ✅ התחברות לפי אימייל וסיסמה
    fun loginUser(email: String, password: String): Mono<UserModel> {
        return userRepository.findByEmail(email)
            .flatMap { user ->
                if (user.password == password) {
                    Mono.just(user)
                } else {
                    Mono.error(IllegalArgumentException("Invalid password"))
                }
            }
    }
    // ✅ שליפת כל המשתמשים
    fun getAllUsers(): Flux<UserModel> {
        return userRepository.findAll()
    }
    // ✅ שליפה לפי ID
    fun getUserById(userId: String): Mono<UserModel> {
        return userRepository.findById(userId)
    }
    fun addChatToUsers(chatId: String, userIds: List<String>): Mono<Void> {
        return Flux.fromIterable(userIds)
            .flatMap { userId ->
                userRepository.findById(userId)
                    .flatMap { user ->
                        val updatedChats = (user.chats ?: mutableListOf()).toMutableList()
                        if (!updatedChats.contains(chatId)) {
                            updatedChats.add(chatId)

                            val updatedUser = UserModel(
                                id = user.id,
                                firstName = user.firstName,
                                lastName = user.lastName,
                                email = user.email,
                                password = user.password,
                                phoneNumber = user.phoneNumber,
                                address = user.address,
                                profileType = user.profileType,
                                registeredAt = user.registeredAt,
                                chats = updatedChats
                            )

                            userRepository.save(updatedUser).then()
                        } else {
                            Mono.empty<Void>()
                        }
                    }
            }
            .then()
    }
    fun resetPassword(phoneNumber: String, newPassword: String): Mono<Void> {
        return userRepository.findByPhoneNumber(phoneNumber)
            .switchIfEmpty(Mono.error(IllegalArgumentException("User with this phone number not found")))
            .flatMap { user ->
                val updatedUser = UserModel(
                    id = user.id,
                    firstName = user.firstName,
                    lastName = user.lastName,
                    email = user.email,
                    password = newPassword, // ← השדה היחיד שמשתנה
                    phoneNumber = user.phoneNumber,
                    address = user.address,
                    profileType = user.profileType,
                    registeredAt = user.registeredAt,
                    chats = user.chats
                )
                userRepository.save(updatedUser)
            }
            .then() // return Mono<Void>
    }
    fun getUsersByType(type: UserType): Flux<UserModel> {
        return userRepository.findAllByProfileType(type)
    }
    fun getFactoryById(factoryId: String): Mono<FactoryUserModel> {
        return mongoTemplate.findById(factoryId, FactoryUserModel::class.java)
            .switchIfEmpty(Mono.error(NoSuchElementException("Factory with ID $factoryId not found")))
    }


}
