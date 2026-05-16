import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(q?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMe(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        emailVerified: boolean;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteMe(userId: string): Promise<void>;
}
