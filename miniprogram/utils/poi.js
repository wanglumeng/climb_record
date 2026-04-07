const BASE_URL = "http://127.0.0.1:8787";

function requestJson(path, params) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: "GET",
      data: params || {},
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(res.data);
        const err = new Error(`HTTP ${res.statusCode}`);
        err.statusCode = res.statusCode;
        err.data = res.data;
        reject(err);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

async function inputtips({ keywords, city }) {
  return requestJson("/api/poi/inputtips", { keywords, city });
}

async function searchPois({ keywords, city, page = 1, pageSize = 20 }) {
  return requestJson("/api/poi/search", { keywords, city, page, pageSize });
}

module.exports = {
  inputtips,
  searchPois
};

