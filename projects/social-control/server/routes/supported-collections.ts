import { Request, Response } from 'express';
export let supportedCollections: string[] = [];

export default (req: Request, res: Response) => res.json(supportedCollections);
