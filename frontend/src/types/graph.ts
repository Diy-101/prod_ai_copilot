/**
 * @fileoverview Graph and node type definitions for Krok MVP
 * 
 * This file contains TypeScript type definitions for the graph editor and
 * node-based system. It defines the structure for different types of nodes,
 * their properties, connections, and the overall graph structure.
 * 
 * The types support a Node-RED inspired system with various node types
 * for different functionalities like HTTP requests, MQTT messaging,
 * data processing, and more.
 * 
 * @author Krok Development Team
 * @version 1.0.0
 */

/**
 * Available node types in the system
 * 
 * Defines all possible node types that can be created in the graph editor.
 * Each type represents a different functionality or data source.
 */
export type NodeType =
  | "server"
  | "database"
  | "network"
  | "service"
  | "api"
  | "storage"
  | "inject"
  | "debug"
  | "function"
  | "change"
  | "switch"
  | "template"
  | "mqtt"
  | "http"
  | "file"
  | "rbe"
  | "serial"
  | "json"
  | "split"
  | "delay"
  | "link";

/**
 * Base interface for node properties
 * 
 * Defines the structure for configurable properties of nodes,
 * including validation rules and UI presentation options.
 */
export interface NodeProperty {
  /** Property name identifier */
  name: string;
  /** Property value */
  value: any;
  /** Data type for validation and UI rendering */
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "textarea"
    | "json"
    | "password";
  /** Whether the property is required */
  required?: boolean;
  /** Description for UI tooltips */
  description?: string;
  /** Options for select type properties */
  options?: { label: string; value: any }[];
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Step increment for number inputs */
  step?: number;
}

/**
 * Properties specific to Inject nodes
 * 
 * Inject nodes are used to trigger flows with predefined data.
 */
export interface InjectNodeProperties {
  /** Data payload to inject */
  payload: string;
  /** MQTT topic for injection */
  topic: string;
  /** Repeat interval in seconds (0 = no repeat) */
  repeat: number;
  /** Cron expression for scheduled injection */
  crontab: string;
  /** Whether to inject only once */
  once: boolean;
  /** Whether to inject when flow starts */
  injectAtStart: boolean;
}

/**
 * Properties specific to HTTP request nodes
 * 
 * HTTP nodes are used to make HTTP requests to external services.
 */
export interface HTTPNodeProperties {
  /** HTTP method to use */
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Target URL for the request */
  url: string;
  /** Whether to use TLS/SSL */
  tls: boolean;
  /** Proxy server configuration */
  proxy: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** HTTP headers to include */
  headers: Record<string, string>;
  /** Request body content */
  body: string;
  /** Whether to follow redirects */
  followRedirects: boolean;
  /** Whether to reject unauthorized certificates */
  rejectUnauthorized: boolean;
}

/**
 * Properties specific to MQTT nodes
 * 
 * MQTT nodes handle messaging protocol communication.
 */
export interface MQTTNodeProperties {
  /** MQTT topic to publish/subscribe to */
  topic: string;
  /** Quality of Service level (0, 1, or 2) */
  qos: 0 | 1 | 2;
  /** Whether to retain the message */
  retain: boolean;
  /** Message payload content */
  payload: string;
  /** Type of payload data */
  payloadType: "string" | "buffer" | "json";
  /** MQTT broker address */
  broker: string;
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
  /** Client identifier */
  clientId: string;
}

/**
 * Properties specific to Function nodes
 * 
 * Function nodes allow custom JavaScript code execution.
 */
export interface FunctionNodeProperties {
  /** JavaScript code to execute */
  func: string;
  /** Number of outputs the function can have */
  outputCount: number;
  /** Execution timeout in milliseconds */
  timeout: number;
  /** Whether to stop execution on error */
  stopOnError: boolean;
}

/**
 * Properties specific to Change nodes
 * 
 * Change nodes modify message properties and flow/global variables.
 */
export interface ChangeNodeProperties {
  /** Array of change rules to apply */
  rules: Array<{
    /** Type of change operation */
    t: "set" | "change" | "delete" | "move";
    /** Property path to modify */
    p: string;
    /** Property type (msg, flow, or global) */
    pt: "msg" | "flow" | "global";
    /** Target property path */
    to: string;
    /** Target property type */
    tot: "msg" | "flow" | "global";
    /** Value to set */
    value: string;
  }>;
}

/**
 * Properties specific to Switch nodes
 * 
 * Switch nodes route messages based on conditions.
 */
export interface SwitchNodeProperties {
  /** Property to evaluate */
  property: string;
  /** Property type to evaluate */
  propertyType: "msg" | "flow" | "global";
  /** Array of routing rules */
  rules: Array<{
    /** Comparison operator */
    t:
      | "=="
      | "!="
      | "<"
      | "<="
      | ">"
      | ">="
      | "null"
      | "nnull"
      | "true"
      | "false"
      | "else";
    /** Value to compare against */
    v: string;
    /** Value type for comparison */
    vt: "str" | "num" | "bool" | "json" | "bin" | "re";
  }>;
  /** Whether to check all rules or stop at first match */
  checkAll: boolean;
}

/**
 * Properties specific to Template nodes
 * 
 * Template nodes format output using templates.
 */
export interface TemplateNodeProperties {
  /** Template string to use */
  template: string;
  /** Template syntax to use */
  syntax: "mustache" | "jsonata";
  /** Output format type */
  output: "str" | "bin" | "obj";
  /** Output format specification */
  format: "none" | "json" | "yaml" | "xml" | "html";
}

/**
 * Properties specific to File nodes
 * 
 * File nodes handle file system operations.
 */
export interface FileNodeProperties {
  /** Target filename */
  filename: string;
  /** Type of filename specification */
  filenameType: "str" | "jsonata";
  /** File operation to perform */
  action: "read" | "write" | "delete" | "append";
  /** Whether to append newline */
  appendNewline: boolean;
  /** Whether to create directory if needed */
  createDir: boolean;
  /** Whether to overwrite existing files */
  overwrite: boolean;
  /** File encoding to use */
  encoding: "utf8" | "base64" | "hex";
}

/**
 * Properties specific to Debug nodes
 * 
 * Debug nodes provide debugging output and status information.
 */
export interface DebugNodeProperties {
  /** Whether the node is active */
  active: boolean;
  /** Whether to output complete message */
  complete: boolean;
  /** Whether to output to console */
  console: boolean;
  /** Whether to output to sidebar */
  tosidebar: boolean;
  /** Whether to output to console */
  toconsole: boolean;
  /** Target type for status */
  targetType: "msg" | "flow" | "global";
  /** Status value to display */
  statusVal: string;
  /** Status type specification */
  statusType: "auto" | "text";
}

/**
 * Properties specific to Delay nodes
 * 
 * Delay nodes introduce timing delays in message flow.
 */
export interface DelayNodeProperties {
  /** Type of pause to apply */
  pauseType: "delay" | "rate" | "rateLimit";
  /** Timeout value */
  timeout: number;
  /** Rate value for rate limiting */
  rate: number;
  /** Units for rate values */
  rateUnits: "second" | "minute" | "hour";
  /** Random first value */
  randomFirst: number;
  /** Random last value */
  randomLast: number;
  /** Units for random values */
  randomUnits: "second" | "minute" | "hour";
  /** Whether to drop messages */
  drop: boolean;
  /** Maximum delay value */
  maxDelay: number;
  /** Units for maximum delay */
  maxDelayUnits: "second" | "minute" | "hour";
}

/**
 * Properties specific to JSON Parser nodes
 * 
 * JSON nodes handle JSON parsing and stringification.
 */
export interface JSONParserNodeProperties {
  /** Property to parse/stringify */
  property: string;
  /** Property type */
  propertyType: "msg" | "flow" | "global";
  /** Action to perform */
  action: "parse" | "stringify";
  /** Whether to format output nicely */
  pretty: boolean;
}

/**
 * Properties specific to Split/Join nodes
 * 
 * Split/Join nodes handle message splitting and joining.
 */
export interface SplitJoinNodeProperties {
  /** Operation mode */
  mode: "split" | "join";
  /** Type of split operation */
  splitType: "length" | "count" | "regex" | "jsonata";
  /** Length for split operations */
  splitLength: number;
  /** Count for split operations */
  splitCount: number;
  /** Regular expression for split */
  splitRegex: string;
  /** JSONata expression for split */
  splitJsonata: string;
  /** Type of join operation */
  joinType: "count" | "timeout" | "manual";
  /** Count for join operations */
  joinCount: number;
  /** Timeout for join operations */
  joinTimeout: number;
  /** Units for join timeout */
  joinTimeoutUnits: "second" | "minute" | "hour";
}

/**
 * Properties specific to Serial nodes
 * 
 * Serial nodes handle serial port communication.
 */
export interface SerialNodeProperties {
  /** Serial port identifier */
  port: string;
  /** Baud rate for communication */
  baudRate: number;
  /** Number of data bits */
  dataBits: 7 | 8;
  /** Number of stop bits */
  stopBits: 1 | 2;
  /** Parity setting */
  parity: "none" | "even" | "odd";
  /** Flow control setting */
  flowControl: "none" | "xon/xoff" | "rts/cts";
  /** Newline character */
  newline: string;
  /** Output character */
  out: string;
  /** Character to add */
  addchar: string;
  /** Split character */
  split: string;
  /** Wait time */
  wait: number;
}

/**
 * Properties specific to RBE (Report by Exception) nodes
 * 
 * RBE nodes only pass messages when values change.
 */
export interface RBENodeProperties {
  /** Property to monitor */
  property: string;
  /** Property type to monitor */
  propertyType: "msg" | "flow" | "global";
  /** Operation mode */
  mode: "block" | "allow";
  /** Array of rules for filtering */
  rules: Array<{
    /** Comparison operator */
    t:
      | "=="
      | "!="
      | "<"
      | "<="
      | ">"
      | ">="
      | "null"
      | "nnull"
      | "true"
      | "false"
      | "regex"
      | "else";
    /** Value to compare against */
    v: string;
    /** Value type for comparison */
    vt: "str" | "num" | "bool" | "json" | "bin" | "re";
  }>;
}

/**
 * Properties specific to Link nodes
 * 
 * Link nodes connect different flows or tabs.
 */
export interface LinkNodeProperties {
  /** Type of link (input or output) */
  linkType: "in" | "out";
  /** Target node or tab */
  target: string;
  /** Target type */
  targetType: "node" | "tab";
}

/**
 * Union type for all node properties
 * 
 * Combines all specific node property types with a generic record
 * for extensibility.
 */
export type NodeProperties =
  | InjectNodeProperties
  | HTTPNodeProperties
  | MQTTNodeProperties
  | FunctionNodeProperties
  | ChangeNodeProperties
  | SwitchNodeProperties
  | TemplateNodeProperties
  | FileNodeProperties
  | DebugNodeProperties
  | DelayNodeProperties
  | JSONParserNodeProperties
  | SplitJoinNodeProperties
  | SerialNodeProperties
  | RBENodeProperties
  | LinkNodeProperties
  | Record<string, any>;

/**
 * Graph node interface
 * 
 * Represents a node in the graph editor with position, health status,
 * properties, and connection points.
 */
export interface GraphNode {
  /** Unique node identifier */
  id: string;
  /** Type of node */
  type: NodeType;
  /** Display name for the node */
  name: string;
  /** X coordinate position */
  x: number;
  /** Y coordinate position */
  y: number;
  /** Health status (0-100) */
  health: number;
  /** Operational status */
  status: "healthy" | "warning" | "critical" | "unknown";
  /** Performance metrics */
  metrics?: {
    /** CPU usage percentage */
    cpu?: number;
    /** Memory usage percentage */
    memory?: number;
    /** Network usage */
    network?: number;
    /** Message count */
    messages?: number;
    /** Error count */
    errors?: number;
  };
  /** Node-specific configuration properties */
  properties: NodeProperties;
  /** Input ports configuration */
  input?: boolean | string[];
  /** Output ports configuration */
  output?: boolean | string[];
  /** Whether the node is enabled */
  enabled?: boolean;
  /** Execution order */
  order?: number;
  /** Connection wires */
  wires?: string[][];
  /** Credential storage */
  credentials?: Record<string, any>;
  /** UI configuration */
  ui?: {
    /** Display label */
    label?: string;
    /** Icon identifier */
    icon?: string;
    /** Color theme */
    color?: string;
    /** Palette label */
    paletteLabel?: string;
    /** Grouping */
    group?: string;
    /** Node width */
    width?: number;
    /** Node height */
    height?: number;
    /** Text alignment */
    align?: "left" | "right" | "center";
  };
}

/**
 * Graph link interface
 * 
 * Represents a connection between nodes in the graph.
 */
export interface GraphLink {
  /** Unique link identifier */
  id: string;
  /** Source node and port */
  source: string;
  /** Target node and port */
  target: string;
  /** Type of connection */
  type: "network" | "dependency" | "data_flow";
  /** Connection status */
  status: "active" | "inactive" | "error";
}

/**
 * Graph interface
 * 
 * Represents a complete graph with nodes, links, and metadata.
 */
export interface Graph {
  /** Unique graph identifier */
  id: string;
  /** Graph name */
  name: string;
  /** Array of nodes in the graph */
  nodes: GraphNode[];
  /** Array of links in the graph */
  links: GraphLink[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}
