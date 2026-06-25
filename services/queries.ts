export const MachineBySerialQuery = `
  query MachineBySerial($serial: String) {
    machines(
      filters: { serial_number: { eq: $serial } }
      pagination: { pageSize: 1 }
      sort: ["title:ASC"]
    ) {
      data {
        id
        attributes {
          type
          status
          title
          hostname
          description
          context
          anydesk_id
          tailscale_ip
          tailscale_hostname
          ssh_user
          ssh_port
          serial_number
          unity_version
          ssd_version
          bootstrap_version
          last_seen_at
          admin_comment
          client {
            data {
              id
              attributes {
                company
                country
                state
                city
              }
            }
          }
        }
      }
    }
  }
`;
