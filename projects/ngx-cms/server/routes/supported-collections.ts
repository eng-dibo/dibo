import { Request, Response } from 'express';
export let supportedCollections = [
  'articles',
  'jobs',
  'articles_categories',
  'jobs_categories',
  'countries',
  'keywords',
  'persons',
  'languages',
  'push_notifications',
];

export default (req: Request, res: Response) => res.json(supportedCollections);
