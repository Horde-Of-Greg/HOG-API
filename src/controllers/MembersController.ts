import type { NextFunction, Request, Response } from "express";

import { MembersService } from "../services/members/MembersService";

export class MembersController {
    private service = new MembersService();

    getIds = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const members = await this.service.getIds();
            res.data = { ids: members };
            next();
        } catch (error) {
            next(error);
        }
    };

    getUsernames = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const members = await this.service.getUsernames();
            res.data = { usernames: members };
            next();
        } catch (error) {
            next(error);
        }
    };

    getUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const members = await this.service.getUsers();
            res.data = { users: members };
            next();
        } catch (error) {
            next(error);
        }
    };
}
