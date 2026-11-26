-- Single-use refresh tokens: id of the refresh token currently valid for this session.
-- Additive and nullable; safe to run before deploying the new code.
ALTER TABLE `user_login_session` ADD COLUMN `refresh_jti` VARCHAR(64) NULL;
