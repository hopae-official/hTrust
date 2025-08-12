// OpenID Federation 1.0 Entity Types and Interfaces
// Based on: https://openid.net/specs/openid-federation-1_0.html

/**
 * OpenID Federation 1.0 Entity Type Identifiers
 * Section 5.1 - Entity Type Identifiers
 */
export enum FederationEntityType {
  FEDERATION_ENTITY = 'federation_entity',
  OPENID_PROVIDER = 'openid_provider',
  OPENID_RELYING_PARTY = 'openid_relying_party',
}

/**
 * JSON Web Key Set (JWKS) structure
 * RFC 7517 - JSON Web Key (JWK)
 */
export interface JsonWebKeySet {
  keys: JsonWebKey[];
}

export interface JsonWebKey {
  kty: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  kid: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  'x5t#S256'?: string;
  // RSA specific
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  // EC specific
  crv?: string;
  x?: string;
  y?: string;
  // Symmetric key specific
  k?: string;
}

/**
 * Entity Statement JWT Header
 * Section 3 - Entity Statement
 */
export interface EntityStatementHeader {
  typ: 'entity-statement+jwt';
  alg: string;
  kid: string;
}

/**
 * Entity Statement JWT Claims
 * Section 3 - Entity Statement
 */
export interface EntityStatementClaims {
  iss: string; // Issuer - who issued this statement
  sub: string; // Subject - who this statement is about
  iat: number; // Issued at
  exp: number; // Expiration time
  jwks: JsonWebKeySet; // Federation Entity signing keys
  metadata?: EntityMetadata; // Entity type specific metadata
  authority_hints?: string[]; // Hints about superior authorities
  trust_marks?: TrustMark[]; // Trust marks for this entity
  metadata_policy?: MetadataPolicy; // Policy for subordinates
  constraints?: Constraints; // Constraints for subordinates
}

/**
 * Entity Metadata - contains metadata for each entity type
 * Section 5 - Metadata
 */
export interface EntityMetadata {
  federation_entity?: FederationEntityMetadata;
  openid_provider?: OpenIDProviderMetadata;
  openid_relying_party?: OpenIDRelyingPartyMetadata;
}

/**
 * Federation Entity Metadata
 * Section 5.1.1 - Federation Entity
 */
export interface FederationEntityMetadata {
  federation_fetch_endpoint?: string;
  federation_list_endpoint?: string;
  federation_resolve_endpoint?: string;
  federation_trust_mark_status_endpoint?: string;
  federation_trust_mark_list_endpoint?: string;
  federation_trust_mark_endpoint?: string;
  federation_historical_keys_endpoint?: string;
  federation_api_endpoint_auth_methods_supported?: string[];
  organization_name?: string;
  organization_uri?: string;
  logo_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
  contacts?: string[];
}

/**
 * OpenID Provider Metadata
 * Section 5.1.3 - OpenID Connect OpenID Provider
 */
export interface OpenIDProviderMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  response_modes_supported?: string[];
  grant_types_supported?: string[];
  acr_values_supported?: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  id_token_encryption_alg_values_supported?: string[];
  id_token_encryption_enc_values_supported?: string[];
  userinfo_signing_alg_values_supported?: string[];
  userinfo_encryption_alg_values_supported?: string[];
  userinfo_encryption_enc_values_supported?: string[];
  request_object_signing_alg_values_supported?: string[];
  request_object_encryption_alg_values_supported?: string[];
  request_object_encryption_enc_values_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  token_endpoint_auth_signing_alg_values_supported?: string[];
  display_values_supported?: string[];
  claim_types_supported?: string[];
  claims_supported?: string[];
  service_documentation?: string;
  claims_locales_supported?: string[];
  ui_locales_supported?: string[];
  claims_parameter_supported?: boolean;
  request_parameter_supported?: boolean;
  request_uri_parameter_supported?: boolean;
  require_request_uri_registration?: boolean;
  op_policy_uri?: string;
  op_tos_uri?: string;
  // Federation specific
  client_registration_types_supported?: string[];
  organization_name?: string;
  logo_uri?: string;
  signed_jwks_uri?: string;
}

/**
 * OpenID Relying Party Metadata
 * Section 5.1.2 - OpenID Connect Relying Party
 */
export interface OpenIDRelyingPartyMetadata {
  redirect_uris: string[];
  response_types?: string[];
  grant_types?: string[];
  application_type?: string;
  contacts?: string[];
  client_name?: string;
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
  jwks_uri?: string;
  jwks?: JsonWebKeySet;
  sector_identifier_uri?: string;
  subject_type?: string;
  id_token_signed_response_alg?: string;
  id_token_encrypted_response_alg?: string;
  id_token_encrypted_response_enc?: string;
  userinfo_signed_response_alg?: string;
  userinfo_encrypted_response_alg?: string;
  userinfo_encrypted_response_enc?: string;
  request_object_signing_alg?: string;
  request_object_encryption_alg?: string;
  request_object_encryption_enc?: string;
  token_endpoint_auth_method?: string;
  token_endpoint_auth_signing_alg?: string;
  default_max_age?: number;
  require_auth_time?: boolean;
  default_acr_values?: string[];
  initiate_login_uri?: string;
  request_uris?: string[];
  // Federation specific
  client_registration_types?: string[];
  organization_name?: string;
  signed_jwks_uri?: string;
}

/**
 * Trust Mark structure
 * Section 7 - Trust Marks
 */
export interface TrustMark {
  id: string; // Trust mark identifier
  trust_mark: string; // JWT with typ: trust-mark+jwt
}

/**
 * Trust Mark JWT Claims
 * Section 7.1 - Trust Mark Claims
 */
export interface TrustMarkClaims {
  iss: string; // Trust mark issuer
  sub: string; // Subject entity
  iat: number; // Issued at
  exp?: number; // Expiration time
  id: string; // Trust mark identifier
  mark?: any; // Trust mark specific claims
  ref?: string; // Reference to trust mark definition
  logo_uri?: string; // Logo for the trust mark
}

/**
 * Metadata Policy
 * Section 6.1 - Metadata Policy
 */
export interface MetadataPolicy {
  [entityType: string]: {
    [parameter: string]: PolicyOperator;
  };
}

export interface PolicyOperator {
  value?: any;
  add?: any;
  default?: any;
  essential?: boolean;
  one_of?: any[];
  subset_of?: any[];
  superset_of?: any[];
}

/**
 * Constraints
 * Section 6.2 - Constraints
 */
export interface Constraints {
  max_path_length?: number;
  naming_constraints?: NamingConstraints;
  allowed_leaf_entity_types?: string[];
}

export interface NamingConstraints {
  permitted?: string[];
  excluded?: string[];
}

/**
 * Entity Status for internal tracking
 */
export enum EntityStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

/**
 * Complete Federation Entity (for internal use)
 */
export interface FederationEntity {
  entity_id: string;
  entity_statement: string; // JWT format Entity Statement
  status: EntityStatus;
  created_at: string;
  updated_at: string;
  // Parsed claims for easy access
  parsed_claims?: EntityStatementClaims;
}
