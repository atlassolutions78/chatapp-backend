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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const presence_service_1 = require("./presence.service");
const presenceSchema = {
    properties: {
        userId: { type: 'string' },
        isOnline: { type: 'boolean' },
        lastSeenAt: { type: 'string', nullable: true, example: '2026-05-05T10:00:00.000Z' },
    },
};
let PresenceController = class PresenceController {
    presenceService;
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    getPresence(userId) {
        return this.presenceService.getPresence(userId);
    }
    getBulkPresence(userIds) {
        const ids = userIds?.split(',').filter(Boolean) ?? [];
        return this.presenceService.getBulkPresence(ids);
    }
};
exports.PresenceController = PresenceController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get presence for a single user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'ID of the user to check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presence data for the user', schema: presenceSchema }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "getPresence", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get presence for multiple users' }),
    (0, swagger_1.ApiQuery)({ name: 'userIds', description: 'Comma-separated list of user IDs', example: 'id1,id2,id3' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Presence data for each requested user',
        schema: { type: 'array', items: presenceSchema },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('userIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "getBulkPresence", null);
exports.PresenceController = PresenceController = __decorate([
    (0, swagger_1.ApiTags)('Presence'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('presence'),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceController);
//# sourceMappingURL=presence.controller.js.map