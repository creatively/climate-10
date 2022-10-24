"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var axios_1 = __importDefault(require("axios"));
var path_1 = __importDefault(require("path"));
var dotenv_1 = __importDefault(require("dotenv"));
var app = (0, express_1["default"])();
dotenv_1["default"].config();
app.use((0, cors_1["default"])({
    credentials: true,
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://weather.visualcrossing.com',
        'https://geodb-free-service.wirefreethought.com/',
        'https://climate-10.herokuapp.com/',
        'https://climate-10.com/'
    ]
}));
app.get('/cities-list', function (req, res) {
    var letters = req.query.letters;
    var url = "".concat(req.protocol, "://geodb-free-service.wirefreethought.com/v1/geo/cities?minPopulation=100000&namePrefix=").concat(letters, "&hateoasMode=false&limit=7&offset=0&sort=name");
    (function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1["default"].get(url)
                            .then(function (response) {
                            var cityDetails = response.data;
                            res.status(200).send(response.data.data);
                        })["catch"](function (error) {
                            console.log("Unable to get list of cities from remote API");
                            res.status(500).send([]);
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    })();
});
app.get('/history', function (req, res) {
    console.log("--- /history/");
    console.log("--- BE called with : ".concat(req.url));
    var lat = req.query.lat;
    var lon = req.query.lon;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    var apiUrl = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/".concat(lat, ",").concat(lon, "/").concat(startDate, "/").concat(endDate, "?unitGroup=uk&elements=name%2Caddress%2CresolvedAddress%2Ctempmax%2Cdatetime&include=days%2Cobs&key=ZG6RTP56DLKZJ8LWJCLVK4RM7&options=preview&contentType=json");
    (0, axios_1["default"])(apiUrl)
        .then(function (response) {
        var data = response.data;
        var days = data.days;
        res.status(200)
            .send(days);
    })["catch"](function (error) {
        var _a;
        var apisErrorMessage = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
        if (apisErrorMessage === null || apisErrorMessage === void 0 ? void 0 : apisErrorMessage.includes("Invalid location found")) {
            console.log("--- invalid location --- lat,lon = ".concat(lat, ", ").concat(lon));
            res.status(422).send("--- invalid location --- lat,lon = ".concat(lat, ", ").concat(lon));
        }
        else {
            res.status(503).send(error);
        }
    });
});
app.use(express_1["default"].static(path_1["default"].join(__dirname, './fe/build')));
app.get('*', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname, './fe/build/index.html'));
});
// start server
var port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log("========= BE server started on port : ".concat(port, " ========"));
});
