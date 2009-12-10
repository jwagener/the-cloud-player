class Track < ActiveRecord::Base
  has_many :listings
  has_one :provider
  # TODO has_many playlists
  
  def self.from_hash(track_hash, provider_id)
    track = Track.find_or_create_by_identifier_and_provider_id(:identifier => reliable_identifier_for_track(track_hash), :provider_id => provider_id)
    track.location =  track_hash['location']
    track.duration =  track_hash['duration']
    track.title =     track_hash['title']
    track.creator =   track_hash['creator']
    track.identifier = track_hash['identifier']
    track.save!
    track
  end
  
  def self.reliable_identifier_for_track(track)
    track['identifier'].blank? ? "#{track['creator']}#{track['title']}#{track['duration']}" : track['identifier']
  end
  
  def to_jspf
    {
      :creator => creator,
      :title   => title,
      :duration => 3333,
      :location => location,
      :identifier => id
    }
  end
end
