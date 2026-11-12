/**
 * 站点全局配置 —— 唯一来源。
 *
 * 站点名称今后只允许从这里读取（`SITE_NAME`），
 * 不要在其他文件硬编码站点名。
 *
 * 排盘口径常量（如晚子时换日规则、时辰划分等）
 * 将来也统一放在这里。
 */

/** 站点名称，全站唯一来源 */
export const SITE_NAME = "blg必胜";

/**
 * 站点正式地址（含协议、不带末尾斜杠）。
 *
 * sitemap.xml / robots.txt 里的绝对地址由它拼接。当前是占位域名，
 * **上线前必须改成真实域名**（见 README「部署说明」），否则搜索引擎
 * 拿到的会是一批 example.com 链接。
 */
export const SITE_URL = "https://blg-sheng.2080556766.workers.dev";
