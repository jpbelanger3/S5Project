var dao = require('./dao')

var api = {
    getWebSiteData: async function(client, cid) {
        var results = {}
        var lastSelectedModule = {}
        var modules = await dao.getModuleListing(client, cid)
        if (modules.rows.length > 0) {
            lastSelectedModule = modules.rows.filter((mod) => { return mod.is_last_selected })[0] || modules.rows[0]
        } else {
            lastSelectedModule.id = 0
        }
        results.modules = modules.rows
        results.selectedModuleId = lastSelectedModule.id || null

        return results
    },

    login: async function(client, username, hash, request) {
        var result = await dao.getPassword(client, username)
        var success = false
        if (result.rows.length > 0 && result.rows[0].password === hash) {
            request.session.user = result.rows[0]
            success = true
        } 

        return success
    },

    switchModule: async function(client, cid, moduleId) {
        await dao.resetSelectedModule(client, cid)
        return await dao.selectModule(client, cid, moduleId)
    },

    getModuleConfig: async function(client, cid, moduleMac) {
        var mid
        var midRes = await dao.getModuleId(client, moduleMac)
        if (midRes.rows.length === 0) {
          midRes = await dao.createNewModule(client, cid, moduleMac)
          mid = midRes.rows[0].id
          await dao.createConfig(client, cid, mid)
        } else {
          mid = midRes.rows[0].id
        }
        var result = await dao.getModuleConfig(client, mid)
        var config = result.rows[0]
        await dao.cleanConfig(client, config.id)

        return config
    },

    postModuleReading: async function(client, moduleMac, timestamp, temperature, ph, ec) {
        var midRes = await dao.getModuleId(client, moduleMac)
        var mid = midRes.rows[0].id
        var readingResult = await dao.insertReading(client, mid, timestamp, temperature, ph, ec)
        await dao.updateLastReadingId(client, mid, readingResult.rows[0].id)
        var result = await dao.isConfigDirty(client, mid)
      
        var needConfigUpdate = result.rows[0].is_dirty
        return needConfigUpdate
    },
}

module.exports = api