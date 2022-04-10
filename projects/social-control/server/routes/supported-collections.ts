import { Request, Response } from 'express';
export let supportedCollections: string[] = [
    'persons','pages','actions'
];

export default (req: Request, res: Response) => res.json(supportedCollections);
