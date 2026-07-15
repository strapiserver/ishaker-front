export const MachineBySerialQuery = `
  query MachineBySerial($serial: String) {
    machines(
      filters: { serial_number: { eq: $serial } }
      pagination: { pageSize: 1000 }
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

export const AdminClientsQuery = `
  query AdminClients {
    clients(
      filters: { status: { eq: "client" } }
      pagination: { pageSize: 1000 }
      sort: ["company:ASC"]
    ) {
      data {
        id
        attributes {
          company
          country
          state
          city
          status
          contact {
            __typename
            ... on ComponentTelegramTelegram {
              telegram
            }
            ... on ComponentWhatsappWhatsapp {
              whatsapp
            }
          }
          machines(sort: ["title:ASC"], pagination: { pageSize: 1000 }) {
            data {
              id
              attributes {
                title
                anydesk_id
                serial_number
                tailscale_ip
                type
                machine_type {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
