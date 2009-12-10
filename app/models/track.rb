class Track < ActiveRecord::Base
  has_many :listings
  # TODO has_many playlists
  
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
