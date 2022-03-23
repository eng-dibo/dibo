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

export default (req: any, res: any) => res.json(supportedCollections);
