import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt} from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async signup(email: string, password: string) {
        // See if emails is in use
        const users = await this.usersService.find(email)
        if (users.length) {
            throw new BadRequestException('email in use');
        }

        // Hash the users password
        // Generate a salt
        const salt = randomBytes(8).toString('hex');

        // Hash the salt and the password together
        const hash = (await scrypt(password, salt, 32)) as Buffer;

        // Join the hashed result and the salt together
        const result = salt + '.' + hash.toString('hex');

        // Create new user and save
        const user = await this.usersService.create(email, result);

        // return the user
        return user;
    }

    async signin(email: string, password: string) {
        const [user] = await this.usersService.find(email)
        if(!user) {
            throw new NotFoundException('user not found');
        }

        const [salt, soteredHash] = user.password.split('.');

        const hash = (await scrypt(password, salt, 32)) as Buffer;

        if(soteredHash !== hash.toString('hex')) {
            throw new BadRequestException('bad password');
        }
        return user;
    }
}