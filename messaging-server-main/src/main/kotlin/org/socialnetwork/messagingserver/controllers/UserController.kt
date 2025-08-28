package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.*
import org.socialnetwork.messagingserver.services.UserService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Controller
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Controller
class UserController(
    private val userService: UserService
) {

    // ✅ התחברות לפי אימייל וסיסמה
    @MessageMapping("users.login")
    fun loginUser(@Payload request: LoginRequest): Mono<UserModel> {
        println("🧍‍Login received: ${request.email}")
        return userService.loginUser(request.email, request.password)
    }

    // ✅ רישום משתמש חדש עם כל השדות
    @MessageMapping("users.register")
    fun registerUser(@Payload request: RegisterUserRequest): Mono<UserModel>
    {
        println("🎉New register received: ${request.email}")
        return userService.registerUser(request)
    }

    // ✅ שליפת כל המשתמשים
    @MessageMapping("users.getAll")
    fun getAllUsers(): Flux<UserModel> {
        return userService.getAllUsers()
    }

    // ✅ שליפת משתמש לפי מזהה
    @MessageMapping("users.getById")
    fun getUserById(@Payload request: UserIdRequest): Mono<UserModel> {
        return userService.getUserById(request.userId)
    }

    @MessageMapping("users.resetPassword")
    fun resetPassword(@Payload request: ResetPasswordRequest): Mono<Void> {
        return userService.resetPassword(
            phoneNumber = request.phoneNumber,
            newPassword = request.newPassword
        )
    }

    // ✅ שליפה לפי סוג המשתמש
    @MessageMapping("users.getByType")
    fun getUsersByType(@Payload type: String): Flux<UserModel> {
        val t = UserType.valueOf(type)
        println("📦 Fetching users of type: $t")
        return userService.getUsersByType(t)
            .doOnNext { println("👤 Found user: ${it.firstName}, type: ${it.profileType}") }
    }
}
