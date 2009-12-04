class Track < ActiveRecord::Base
  has_many :listings
  # TODO has_many playlists
end
