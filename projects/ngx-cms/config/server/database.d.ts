import { Uri } from '@engineers/mongoose';
interface DB {
  type: string;
  config: Uri;
}
declare let db: DB;
export default db;
