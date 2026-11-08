import { q } from './db';
const T = "id,room_code,tenant_name,tenant_wa,period_type,payment_status,status,survey_date::text survey_date,check_in::text check_in,check_out::text check_out";
export const getRooms = () => q('select code,name,building,location,description,facilities,video_url,photo_url,price_daily,price_weekly,price_monthly,tags,capacity from rooms order by code');
export const getPublicOcc = () => q("select room_code,period_type,status,check_in::text check_in,check_out::text check_out from tenancies where status in ('aktif','booking')");
export const getTenancies = (code) => q(`select ${T} from tenancies ${code ? 'where room_code=$1' : ''} order by coalesce(check_in,survey_date) desc nulls last, id desc`, code ? [code] : []);
export const getWaitlist = (code) => q(`select id,room_code,name,origin,wa,created_at::text created_at from waitlist ${code ? 'where room_code=$1' : ''} order by created_at`, code ? [code] : []);
