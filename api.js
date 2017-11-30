var dao = require('./dao')

var api = {
    getWebSiteData: async function(client, cid) {
        var results = {}
        var lastSelectedModule = {}
        var modules = await dao.getModuleListing(client, cid)
        if (modules.rows.length > 0) {
            lastSelectedModule = modules.rows.filter((mod) => { return mod.is_last_selected })[0] || modules.rows[0]
            data = await Promise.all([ //execute at same time
                dao.getReading(client, lastSelectedModule.last_reading_id),
                dao.getModuleConfig(client, lastSelectedModule.id),
                dao.getConfigListing(client, cid),
            ])
            var reading = data[0].rows[0]
            var config = data[1].rows[0]
            var configListing = data[2].rows
        } else {
            lastSelectedModule.id = 0
        }

        results.modules = modules.rows
        results.selectedModuleId = lastSelectedModule.id || null
        results.reading = reading
        results.config = config
        results.configListing = configListing

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
          var config = await dao.createConfig(client, cid, mid)
          await dao.assignConfigToModule(client, mid, config.rows[0].id)
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

    switchProfile: async function(client, cid, mid, profileId) {
        await Promise.all([
            dao.assignConfigToModule(client, mid, profileId),
            dao.setConfigDirty(client, profileId),
        ])
        config = await dao.getModuleConfig(client, mid)

        return config.rows[0]
    },

    updateProfile: async function(client, profileId, field, value) {
        return dao.updateProfileField(client, profileId, field, value)
    },

    getTemperature: async function(client, cid, moduleId) {
        var tempRes = await dao.getTemperature(client, cid, moduleId)
        
        return tempRes.rows
    },

    getDataForAndroidApp: async function(client, cid) {
        var data = {}
        var moduleRes = await dao.getModuleWithConfig(client, cid)

        data.modules = moduleRes.rows
        
        return data
    },

    getPh: async function(client, cid, moduleId) {
        var phRes = await dao.getPh(client, cid, moduleId)
        
        return phRes.rows
    },

    getFertilisant: async function(client, cid, moduleId) {
        var fertRes = await dao.getFertilisant(client, cid, moduleId)
        
        return fertRes.rows
    },

    getPublicProfiles: async function(client) {
        var profileRes = await dao.getPublicConfigListing(client)

        return profileRes.rows
    },

    importProfiles: async function(client, cid, publicProfilesId) {
        var promises = []
        ids = publicProfilesId || []
        ids.forEach((id) => {
            promises.push(dao.importProfile(client, cid, id))
            promises.push(dao.incrementProfileImport(client, id))
        })

        return Promise.all(promises)
    },
}

module.exports = api