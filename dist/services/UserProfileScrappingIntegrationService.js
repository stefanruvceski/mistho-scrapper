"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResponseModel_1 = __importDefault(require("../models/ResponseModel"));
const LoginHelper_1 = require("../pageobjects/Login/LoginHelper");
const ProfilePageHelper_1 = require("../pageobjects/Profile/ProfilePageHelper");
const PuppeteerManager_1 = require("../util/PuppeteerManager");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const PuppeteerCluster_1 = require("../util/PuppeteerCluster");
const UserProfileService_1 = __importDefault(require("./UserProfileService"));
class ScrappingService {
    static async ScrapeUserData(body) {
        try {
            const generatedUuid = (0, uuid_1.v4)();
            // prepare puppeteer cluster task
            await PuppeteerCluster_1.cluster.task(async ({ page }) => {
                try {
                    // each instance will have its own download folder
                    await page['_client'].send('Page.setDownloadBehavior', {
                        behavior: 'allow',
                        downloadPath: path_1.default.resolve(__dirname, `../../tmp/${generatedUuid}`),
                    });
                    await (0, PuppeteerManager_1.goToUrl)(page, "https://www.glassdoor.com/index.htm" /* GLASSDOOR */);
                    await (0, LoginHelper_1.login)(page, body);
                    // HOME PAGE
                    const profileContainer = await page.waitForSelector("[data-ga-lbl=\"My Profile\"]" /* PROFILE_CONTAINER */);
                    //sometimes it needs a bit more to load
                    await page.waitForTimeout(1000);
                    await profileContainer.evaluate((b) => b.click());
                    // PROFILE PAGE
                    const userProfileData = await (0, ProfilePageHelper_1.getProfileData)(page, generatedUuid);
                    await UserProfileService_1.default.saveOrUpdateUser(userProfileData);
                    await (0, LoginHelper_1.logout)(page);
                    // HOME PAGE
                    await page.close();
                    return userProfileData;
                }
                catch (err) {
                    await page.close();
                    throw new Error(err.message);
                }
            });
            // execute puppeteer task
            const result = await PuppeteerCluster_1.cluster.execute("https://www.glassdoor.com/index.htm" /* GLASSDOOR */);
            await PuppeteerCluster_1.cluster.idle();
            await PuppeteerCluster_1.cluster.close();
            return new ResponseModel_1.default().Success(result);
        }
        catch (err) {
            console.log(err);
            return new ResponseModel_1.default().Failed({ message: err.message, messageCode: 'FAILED' }, 500);
        }
    }
}
exports.default = ScrappingService;
//# sourceMappingURL=UserProfileScrappingIntegrationService.js.map