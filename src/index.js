import Logger from './Logger'
import CreativeAnalyzer from './CreativeAnalyzer'
import PlacementStorage from './PlacementStorage'

import axios from 'axios'

const publisherInstance = axios.create({
  baseURL: '/api/publishers',
  headers: {
    'Content-Type': 'application/json'
  }
})

const NOT_ALLOWED_TAKEOVERS = [2233, 45435, 2352, 6683]

class CreativeManager {
  constructor (publisherId) {
    this.publisherId = publisherId

    this.fetch()
  }

  fetchPublisher () {
    return publisherInstance.get(`/${this.publisherId}`)
      .then(data => {
        this.publisher = data.publisher
      })
  }

  fetchCreatives () {
    return publisherInstance.get(`/${this.publisherId}/creatives`)
      .then(data => {
        this.creatives = data.creatives
      })
  }

  fetch () {
    return Promise.all(this.fetchPublisher(), this.fetchCreatives())
  }

  renderCreative ({ logger, creative: { id, name, adType, size, price } }) {
    logger.send('Creative rendered', {
      creative_id: id,
      creative_name: name,
      creative_type: adType,
      creative_size: size,
      creative_price: price
    })

    CreativeAnalyzer.run({
      id,
      name,
      type: adType,
      price
    })
  }

  run () {
    for (const creative of this.creatives) {
      this.renderCreative(new Logger(), creative)

      switch (creative.adType) {
        case 'simple': {
          this.render({
            placementId: PlacementStorage.find(creative.placementId),
            htmlStr: creative.html
          })

          break
        }

        case 'takeover': {
          if (NOT_ALLOWED_TAKEOVERS.indexOf(creative.takeoverId) === -1) {
            this.render({
              placementId: PlacementStorage.find(creative.placementId),
              params: creative.takeoverParams
            })
          }

          break
        }

        case 'hybrid': {
          if (creative.hybrid.vertical) {
            this.render({
              placementId: PlacementStorage.find(creative.placementId),
              htmlStr: creative.hybrid.verticalHtml
            })
          } else if (creative.hybrid.horizontal) {
            this.render({
              placementId: PlacementStorage.find(creative.placementId),
              htmlStr: creative.hybrid.horizontalHtml
            })
          } else if (creative.hybrid.takeover) {
            if (NOT_ALLOWED_TAKEOVERS.indexOf(creative.hybrid.takeoverId) === -1) {
              this.render({
                placementId: PlacementStorage.find(creative.placementId),
                params: creative.hybrid.takeoverParams
              })
            }
          } else {
            this.render({
              placementId: PlacementStorage.find(creative.placementId),
              htmlStr: creative.hybrid.html
            })
          }

          break
        }
      }
    }
  }

  render ({ placementId, htmlStr, params }) {
    if (params) {
    // renders creative in a specific way

      return
    }

    const placement = document.getElementById(placementId)

    placement.innerHTML = htmlStr
  }
}

// Usage:

const creativeManager = new CreativeManager({
  publisherId: 1
})

// ....

creativeManager.run()
