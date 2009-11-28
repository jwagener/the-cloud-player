require 'soundcloud'

$soundcloud_consumer = Soundcloud.consumer(
  $settings[:soundcloud_consumer][:key], 
  $settings[:soundcloud_consumer][:secret], 
  $settings[:soundcloud_consumer][:site])