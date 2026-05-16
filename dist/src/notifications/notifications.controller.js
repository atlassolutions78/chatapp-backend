"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const notifications_service_1 = require("./notifications.service");
class PushMessageDto {
    channelId;
    channelType;
    senderName;
    messageText;
    messageId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushMessageDto.prototype, "channelId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushMessageDto.prototype, "channelType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushMessageDto.prototype, "senderName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushMessageDto.prototype, "messageText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushMessageDto.prototype, "messageId", void 0);
let NotificationsController = NotificationsController_1 = class NotificationsController {
    svc;
    logger = new common_1.Logger(NotificationsController_1.name);
    constructor(svc) {
        this.svc = svc;
    }
    async pushMessage(senderId, body) {
        const { channelId, channelType, senderName, messageText, messageId } = body;
        this.svc
            .pushMessage(senderId, channelId, channelType, senderName, messageText, messageId)
            .catch((err) => this.logger.error('pushMessage error:', err));
        return { ok: true };
    }
    async streamWebhook(req) {
        const event = req.body;
        if (event?.type === 'message.new' && event.message) {
            const m = event.message;
            this.svc
                .pushMessage(m.user?.id ?? '', event.channel_id ?? '', event.channel_type ?? 'messaging', m.user?.name ?? 'Unknown', m.text?.slice(0, 100) ?? '', m.id ?? '')
                .catch((err) => this.logger.error('webhook pushMessage error:', err));
        }
        return { ok: true };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('push-message'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PushMessageDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "pushMessage", null);
__decorate([
    (0, common_1.Post)('webhook/stream-chat'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "streamWebhook", null);
exports.NotificationsController = NotificationsController = NotificationsController_1 = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map