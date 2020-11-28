#!/bin/sh

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root (use sudo)"
  exit 1
fi

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Usage: sudo ${0}"
  exit 0
fi

file="launchapp.sh"

if [ ! -f "$file" ]; then
  echo "Error: $file not found!"
  exit 1
fi

service_name="marshmello"
service_name="$service_name.service"
script_dir="$(cd "$(dirname "$0")" && pwd)"

service_file=$(cat <<END_HEREDOC
[Unit]
Description=Marshmello
After=network.target
[Service]
WorkingDirectory=$script_dir
ExecStart=$script_dir/$file
# we may not have network yet, so retry until success
Restart=on-failure
RestartSec=3s
[Install]
WantedBy=multi-user.target
END_HEREDOC
)

echo "Installing ${service_name}..."
echo "$service_file" > /etc/systemd/system/"$service_name"
echo "Enabling $service_name..."
systemctl enable "$service_name"
echo "Starting $service_name..."
systemctl start "$service_name"
echo "========================="
