# Marshmello
A smart home REST API

#### API

* `fishfeedr?delay={DELAY_IN_MINUTES}&batt={BATTERY_LEVEL}`: trigger fishfeedr routine by turning off pump, scheduling to turn it on after `delay` minutes, send battery level to ThingSpeak, and notify via Slack.
