/* ====== Supabase 客户端配置 ====== */
/* publishable key 本身就是公开的（相当于匿名 API key），放进前端是官方设计。
   注意：sb_secret_ 开头的密钥绝不能出现在任何前端代码里。 */
const SB_URL = "https://xbfnkdpklksngxyxeesr.supabase.co";
const SB_KEY = "sb_publishable_cU70NP7yznkdVWxj-Pr-zw_ILrYh1f0";
const sb = supabase.createClient(SB_URL, SB_KEY, {
  auth: { persistSession: true, storageKey: "icqb_auth" }
});
