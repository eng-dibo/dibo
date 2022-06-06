import { Request, Response } from 'express';
export let supportedCollections: string[] = ['persons', 'pages', 'actions'];

export default (request: Request, res: Response) =>
  res.json(supportedCollections);
